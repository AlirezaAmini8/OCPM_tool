import os
import pickle

import uuid
import boto3
import pm4py
from pm4py.visualization.ocel.ocdfg.variants import classic
from pm4py.visualization.ocel.ocpn import visualizer as ocpn_visualizer

from ocel_mining_tool import settings


def discover(ocel, is_ocdfg):
    if is_ocdfg:
        return pm4py.discover_ocdfg(ocel)
    else:
        return pm4py.discover_oc_petri_net(ocel, "imd")


def get_content(gviz):
    path = f"./{uuid.uuid4()}"
    file = gviz.render(path)

    with open(file, "r") as f:
        content = f.read()

    os.remove(path)
    return content


def discover_oc_petri_net(ocpn, parameters):
    gviz = ocpn_visualizer.apply(ocpn, parameters=parameters)
    return get_content(gviz)


def discover_ocdfg(ocdfg, parameters):
    gviz = classic.apply(ocdfg, parameters=parameters)
    return get_content(gviz)


def readFromS3(file_name, file_path):
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    download_path = os.path.join(settings.MEDIA_ROOT, file_name)
    s3_client.download_file(settings.AWS_STORAGE_BUCKET_NAME, file_path, download_path)
    return download_path


def filter_ocel(ocel, filters=None):
    if filters is None:
        filters = {
            "activity_percent": 90,
            "path_percent": 90,
            "selected_objects": None,
            "annotation_type": "unique_objects",
            "orientation": "LR"
        }

    if filters.get("selected_objects"):
        ocel = pm4py.filter_ocel_object_types(ocel, filters["selected_objects"])

    activity_threshold = 0
    path_threshold = 0

    if filters.get("activity_percent") or filters.get("path_percent"):
        activity_threshold = filters.get("activity_percent", 10)
        path_threshold = filters.get("path_percent", 10)

        activity_threshold = int(((100 - activity_threshold) / 100) * len(pm4py.ocel.ocel_object_type_activities(ocel)))
        path_threshold = int(((100 - path_threshold) / 100) * len(ocel.objects))

    parameters = {

        classic.Parameters.FORMAT: 'svg',
        classic.Parameters.ANNOTATION: "frequency",
        classic.Parameters.ACT_METRIC: filters.get("annotation_type", "unique_objects"),
        classic.Parameters.EDGE_METRIC: filters.get("annotation_type", "unique_objects"),
        classic.Parameters.ACT_THRESHOLD: activity_threshold,
        classic.Parameters.EDGE_THRESHOLD: path_threshold,
        classic.Parameters.PERFORMANCE_AGGREGATION_MEASURE: 'mean',
        "bgcolor": 'white',
        "rankdir": filters.get("orientation", "LR")
    }

    return parameters


def serialize_in_file(discovered):
    serialized_graph_path = f"{uuid.uuid4()}.pkl"
    with open(serialized_graph_path, 'wb') as f:
        pickle.dump(discovered, f)
    return serialized_graph_path


def deserialize_file(serialized_graph_path):
    with open(serialized_graph_path, 'rb') as f:
        discovered = pickle.load(f)
    return discovered
