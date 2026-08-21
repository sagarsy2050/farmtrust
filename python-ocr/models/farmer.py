"""
Assembles the final identity-document output in the exact shape the
FarmTrust Node backend expects. aadhaar_number/kisan_card_number are
already masked by the time they reach here — see extraction/aadhaar.py and
extraction/kisan_card.py, which never let the full number leave their module.
"""


def build_result(document_type: str, farmer_fields: dict, aadhaar_result, kisan_result, verification: dict) -> dict:
    farmer = {
        "name": farmer_fields.get("name", ""),
        "kisan_card_number": (kisan_result or {}).get("masked", ""),
        "aadhaar_number": (aadhaar_result or {}).get("masked", ""),
        "address": farmer_fields.get("address", ""),
        "village": farmer_fields.get("village", ""),
        "taluka": farmer_fields.get("taluka", ""),
        "district": farmer_fields.get("district", ""),
        "state": farmer_fields.get("state", ""),
        "pincode": farmer_fields.get("pincode", ""),
    }
    result = {
        "document_type": document_type,
        "farmer": farmer,
        "verification": verification,
    }
    if aadhaar_result is not None:
        result["verification"]["aadhaar_checksum_valid"] = aadhaar_result.get("checksum_valid")
    return result
