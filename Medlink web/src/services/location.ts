export interface LocationDetails {
  hospitalAddress: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails> {
  try {
    // Using OpenStreetMap Nominatim for free reverse geocoding
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'en',
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch location details");
    }

    const data = await response.json();
    const address = data.address || {};

    const hospitalAddress = address.hospital || address.clinic || address.amenity || data.display_name || "";
    const city = address.city || address.town || address.village || address.county || "";
    const state = address.state || "";
    const country = address.country || "";
    const pinCode = address.postcode || "";

    return {
      hospitalAddress,
      city,
      state,
      country,
      pinCode,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw new Error("Could not determine address from coordinates.");
  }
}
