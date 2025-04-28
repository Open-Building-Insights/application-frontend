Attribute Dictionary:
- latitude --> latitude of the centroid of the building in degrees
- longitude --> longitude of the centroid of the building in degrees
- source --> Source of the building footprint (Google Open Buildings | Microsoft Building Footprints | OSM)
- urban_split --> Urban classification (Urban | Sub-urban | Rural)
- ghsl_smod --> Degree of Urbanisation derived by GHS-SMOD R2023A - GHS settlement layers
- res_type --> Residential Vs non-Residential building as per classification source
- type_source --> Source of the classification output (classification model | OSM derived)
- osm_type --> Tag if building classification is OpenStreetMap derived
- confidence --> Confidence value of the classification model (in percentage)
- height --> Height of the building in meters derived from WSF3DV3
- floors --> Estimated number of floors based on height of the building assuming ~3m/floor (first floor assumed ~4.5m)
- building_faces --> Estimated number of outer walls (faces) of the building (based on its geometry)
- perimeter_in_meters --> Estimated total length of the outer walls of the building in meters (based on its geometry)
- area_in_meters --> Estimated roof area of the building in square meters (when viewed from top based on its geometry)
- gfa_in_meters --> Gross floor area in square meters: Estimated based on rooftop area times the amount of floors
- elec_access_percent --> Estimated mean likelihood that the building of interest is connected to the electric grid, derived from Open Energy Maps
- elec_consumption_kWh_month --> Mean-point estimate of a modelled distribution curve of monthly electricity consumption for a building, given in kWh, derived from Open Energy Maps
- elec_consumption_std_kWh_month --> Standard deviation of the monthly electricity consumption value, derived from Open Energy Maps


Sources & References:
- Sentinel-2 Cloud-Optimized GeoTIFFs: Sentinel-2 satellite images are downloaded from the public S3 bucket Sentinel-2 Cloud-Optimized GeoTIFFs containing satellite images of the Earth’s surface divided into pre-defined tiles (https://sentiwiki.copernicus.eu/web/s2-mission).

- German Aerospace Center (DLR): Provides WSF3DV3 data layer that is used for the building height calculation process (https://geoservice.dlr.de/web/maps/eoc:wsf3d) & Esch, Brzoska, Dech, Leutner, Palacios-Lopez, Metz-Marconcini, Marconcini, Roth and Zeidler, 2022: "World Settlement Footprint 3D - A first three-dimensional survey of the global building stock".

- Google-Microsoft Open Buildings (combined and published by VIDA): Publicly available data contain a catalogue of buildings with specific coordinates and polygons (i.e. shapes of the buildings) for any given country or region (https://source.coop/repositories/vida/google-microsoft-open-buildings/description).

- GHS Settlement Model Grid: Publicly available data downloaded as GeoTIF to categorize buildings into Urban or Rural categories (https://human-settlement.emergency.copernicus.eu/download.php?ds=smod) || Schiavina, Marcello; Melchiorri, Michele; Pesaresi, Martino (2023): GHS-SMOD R2023A - GHS settlement layers, application of the Degree of Urbanisation methodology (stage I) to GHS-POP R2023A and GHS-BUILT-S R2023A, multitemporal (1975-2030). European Commission, Joint Research Centre (JRC) [Dataset] doi: 10.2905/A0DF7A6F-49DE-46EA-9BDE-563437A6E2BA PID: http://data.europa.eu/89h/a0df7a6f-49de-46ea-9bde-563437a6e2ba || Concept & Methodology: European Commission, and Statistical Office of the European Union, 2021. Applying the Degree of Urbanisation — A methodological manual to define cities, towns and rural areas for international comparisons — 2021 edition Publications Office of the European Union, 2021, ISBN 978-92-76-20306-3 doi: 10.2785/706535/

- Open Street Map (OSM): Publicly available data contain a catalogue of buildings with specific coordinates and polygons (i.e. shapes of the buildings). Data are downloaded as shapefiles (.shp) from geofabrik.de.

- Ookla’s Open Data: Open data sets available on a complimentary basis to help people make informed decisions around internet connectivity and internet speed (https://www.ookla.com/ookla-for-good/open-data).

- Overture Maps: Publicly available data contain a catalogue of buildings with specific coordinates and polygons (i.e. shapes of the buildings) (https://overturemaps.org/).

- Open Energy Maps: Providing building-level electricity access and consumption estimates for Kenya (https://www.openenergymaps.org/) & Lee, S.J., 2023: "Multimodal Data Fusion for Estimating Electricity Access and Demand" (Doctoral dissertation, Massachusetts Institute of Technology).


Note: The data is shared under the Open Data Commons Open Database License (ODbL) v1.0 license (https://opendatacommons.org/licenses/odbl/1-0/). 


This work was supported and built by SEforALL, DLR, Open Energy Maps, and Mahila Housing Trust through IBM Sustainability Accelerator program (2024). More info about the programme is available here https://www.ibm.com/impact/initiatives/ibm-sustainability-accelerator.
