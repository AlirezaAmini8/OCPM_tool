import os

import uuid
import boto3
import pm4py
from pm4py.visualization.ocel.ocdfg.variants import classic
from pm4py.visualization.ocel.ocpn import visualizer as ocpn_visualizer

from ocel_mining_tool import settings


def discover_oc_petri_net(ocel):
    ocpn = pm4py.discover_oc_petri_net(ocel, "imd")
    params = {
        'format': 'svg',
        'bgcolor': 'white',
        'rankdir': 'LR'
    }

    gviz = ocpn_visualizer.apply(ocpn, parameters=params)
    return gviz


def discover_ocdfg(ocel, filters, activity_threshold, path_threshold):
    ocdfg = pm4py.discover_ocdfg(ocel)

    parameters = {
        classic.Parameters.FORMAT: 'svg',
        classic.Parameters.ANNOTATION: "frequency",
        classic.Parameters.ACT_METRIC: filters.get("annotation_type", "unique_objects"),
        classic.Parameters.EDGE_METRIC: filters.get("annotation_type", "unique_objects"),
        classic.Parameters.ACT_THRESHOLD: activity_threshold,
        classic.Parameters.EDGE_THRESHOLD: path_threshold,
        classic.Parameters.PERFORMANCE_AGGREGATION_MEASURE: 'mean',
        "bgcolor": 'white',
        "rankdir": 'LR'
    }

    gviz = classic.apply(ocdfg, parameters=parameters)

    path = f"./{uuid.uuid4()}"
    file = gviz.render(path)

    with open(file, "r") as f:
        content = f.read()

    os.remove(path)
    return content


def readFromS3(file_metadata):
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    download_path = os.path.join(settings.MEDIA_ROOT, file_metadata.file_name)
    s3_client.download_file(settings.AWS_STORAGE_BUCKET_NAME, file_metadata.file_path, download_path)
    return download_path


def filter_ocel(ocel, filters=None):
    if filters is None:
        filters = {
            "activity_percent": 10,
            "path_percent": 10,
            "selected_objects": None,
            "annotation_type": "unique_objects",
            "visualization": discover_ocdfg
        }

    if filters.get("selected_objects"):
        ocel = pm4py.filter_ocel_object_types(ocel, filters["selected_objects"])

    activity_threshold = 0
    path_threshold = 0

    if filters.get("activity_percent") or filters.get("path_percent"):
        activity_threshold = filters.get("activity_percent", 10)
        path_threshold = filters.get("path_percent", 10)

        activity_threshold = int((activity_threshold / 100) * len(ocel.events))
        path_threshold = int((path_threshold / 100) * len(ocel.objects))

    return filters.get("visualization")(ocel, filters, activity_threshold, path_threshold)
