"""
FarmTrust AI-generated-image detector worker.

Invoked by the Node server as: uv run detector_worker.py <file_path>
Loads the CvT-13 checkpoint trained by guyfloki/ai-image-detector and
classifies an uploaded document image as "real" or "fake" (AI-generated).

CONTRACT: stdout carries ONLY the final json.dumps(...) payload. Everything
else (progress, library warnings) goes to stderr - same rule as
python-ocr/ocr_worker.py, for the same reason (Node parses stdout as JSON).
"""
import sys
import os
import json
import glob
import argparse
import contextlib
import io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _log(msg):
    print(msg, file=sys.stderr)


def _load_checkpoint(latest_file, device):
    import torch
    try:
        return torch.load(latest_file, map_location=device, weights_only=True)
    except Exception as e:
        _log(f"weights_only=True load failed ({e}); retrying with weights_only=False")
        return torch.load(latest_file, map_location=device, weights_only=False)


def load_latest_model(model, device, weights_folder):
    import torch
    list_of_files = glob.glob(os.path.join(weights_folder, 'model_epoch_*.pth'))
    if not list_of_files:
        raise FileNotFoundError(f"No model files found in {weights_folder}.")
    latest_file = max(list_of_files, key=os.path.getctime)
    checkpoint = _load_checkpoint(latest_file, device)
    model.load_state_dict(checkpoint['model_state_dict'])
    return model


def predict_single_image(image_path, model, device, transform):
    import torch
    from PIL import Image

    image = Image.open(image_path).convert("RGB")
    transformed_image = transform(image).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        outputs = model(transformed_image)
        _, predicted = outputs.logits.max(1)
        probabilities = torch.nn.functional.softmax(outputs.logits, dim=1)

    label_map = {0: "real", 1: "fake"}
    predicted_label = label_map[predicted.item()]
    confidence = probabilities[0, predicted.item()].item()
    return predicted_label, confidence, probabilities[0].tolist()


def run(image_path, weights_folder):
    import torch
    from model import get_model, get_transform

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = get_model(device)
    model = load_latest_model(model, device, weights_folder)
    transform = get_transform()

    label, confidence, probs = predict_single_image(image_path, model, device, transform)

    return {
        "label": label,
        "ai_generated": label == "fake",
        "confidence": confidence,
        "probabilities": {"real": probs[0], "fake": probs[1]},
    }


def main():
    parser = argparse.ArgumentParser(description='Classify an image as real or AI-generated.')
    parser.add_argument('image_path', type=str)
    parser.add_argument('--weights_folder', type=str, default='../model')
    args = parser.parse_args()

    # Swallow any stray stdout writes from torch/transformers during model
    # load/inference so only our final json.dumps reaches the parent process
    # (same corruption risk called out in ocr_worker.py's CONTRACT).
    captured = io.StringIO()
    try:
        with contextlib.redirect_stdout(captured):
            result = run(args.image_path, args.weights_folder)
    except Exception as e:
        _log(f"detector_worker failed: {e}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    leaked = captured.getvalue()
    if leaked.strip():
        _log(f"[warn] suppressed stray stdout from detector deps: {leaked[:300]!r}")

    print(json.dumps(result))


if __name__ == "__main__":
    main()
