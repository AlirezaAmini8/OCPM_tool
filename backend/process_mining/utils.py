import os

import uuid
import boto3
import pm4py
from pm4py.visualization.ocel.ocdfg.variants import classic
from pm4py.visualization.ocel.ocpn import visualizer as ocpn_visualizer

from ocel_mining_tool import settings


def discover_oc_petri_net(file_metadata):
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    download_path = os.path.join(settings.MEDIA_ROOT, file_metadata.file_name)
    s3_client.download_file(settings.AWS_STORAGE_BUCKET_NAME, file_metadata.file_path, download_path)

    ocel_log = pm4py.read_ocel(download_path)

    ocpn = pm4py.discover_oc_petri_net(ocel_log, "imd")
    params = {
        'format': 'html',
        'bgcolor': 'white',
        'rankdir': 'LR'
    }

    gviz = ocpn_visualizer.apply(ocpn, parameters=params)
    os.remove(download_path)
    return gviz


def discover_ocdfg(file_metadata):
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    download_path = os.path.join(settings.MEDIA_ROOT, file_metadata.file_name)
    s3_client.download_file(settings.AWS_STORAGE_BUCKET_NAME, file_metadata.file_path, download_path)

    ocel_log = pm4py.read_ocel(download_path)
    ocdfg = pm4py.discover_ocdfg(ocel_log)

    object_types = pm4py.ocel_get_object_types(ocel_log)
    print("Object types: ", object_types)

    object_attr = pm4py.ocel_get_attribute_names(ocel_log)
    print("Object attrs: ", object_attr)

    parameters = {
        classic.Parameters.FORMAT: 'svg',
        classic.Parameters.ANNOTATION: 'frequency',
        classic.Parameters.ACT_METRIC: 'unique_objects',
        classic.Parameters.EDGE_METRIC: 'unique_objects',
        classic.Parameters.ACT_THRESHOLD: 500,
        classic.Parameters.EDGE_THRESHOLD: 500,
        classic.Parameters.PERFORMANCE_AGGREGATION_MEASURE: 'mean',
        "bgcolor": 'white',
        "rankdir": 'LR'
    }

    gviz = classic.apply(ocdfg, parameters=parameters)

    os.remove(download_path)
    path = f"./{uuid.uuid4()}"
    file = gviz.render(path)

    with open(file, "r") as f:
        content = f.read()

    os.remove(path)
    return content


def filterObject(ocel):
    filtered_ocel = pm4py.filter_ocel_cc_object(ocel, 'order1')
    pm4py.filtering.filter_ocel_end_events_per_object_type()
    pm4py.filter_ocel_objects()
