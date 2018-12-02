import requests
from urllib.request import urlopen
import json
import sys

# URL for image
image_url = sys.argv[1]

# Replace <Subscription Key> with your valid subscription key.
subscription_key = "016524ae10a04b0bb5de04b0aa54a833"
assert subscription_key

# You must use the same region in your REST call as you used to get your
# subscription keys. For example, if you got your subscription keys from
# westus, replace "westcentralus" in the URI below with "westus".
#
# Free trial subscription keys are generated in the "westus" region.
# If you use a free trial subscription key, you shouldn't need to change
# this region.
vision_base_url = "https://westcentralus.api.cognitive.microsoft.com/vision/v1.0/"

analyze_url = vision_base_url + "analyze"

# Set image_path to the local path of an image that you want to analyze.
image = urlopen(image_url)

# Read the image into a byte array
image_data = image.read()
headers    = {'Ocp-Apim-Subscription-Key': subscription_key,
              'Content-Type': 'application/octet-stream'}
params     = {'visualFeatures': 'Categories,Description,Color'}
response = requests.post(
    analyze_url, headers=headers, params=params, data=image_data)
response.raise_for_status()

# parse caption from JSON file output
result = response.json()

description = result['description']
tag_list = description['tags']
caption = description['captions'][0]
text = caption['text'].capitalize()

# output the description
print(text)
