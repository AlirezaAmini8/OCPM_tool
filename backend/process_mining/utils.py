import os
import pickle

import uuid
import pm4py
from pm4py.visualization.ocel.ocdfg.variants import classic
from pm4py.visualization.ocel.ocpn import visualizer as ocpn_visualizer
from pm4py.visualization.ocel.ocpn.variants import wo_decoration


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


def filter_ocel_ocdfg(ocel, ocdfg=None, filters=None):
    if filters is None:
        filters = {
            "activity_percent": 10,
            "path_percent": 10,
            "selected_objects": None,
            "annotation_type": "unique_objects",
            "orientation": "LR"
        }

    if filters.get("selected_objects"):
        ocel = pm4py.filter_ocel_object_types(ocel, filters["selected_objects"])
        ocdfg = discover(ocel, True)

    activity_threshold, path_threshold = compute_percentage_thresholds(
            ocdfg,
            filters.get("activity_percent", 10),
            filters.get("path_percent", 10),
            act_metric=filters.get("annotation_type", "unique_objects"),
            edge_metric="event_couples" if filters.get("annotation_type") == 'events' else
            filters.get("annotation_type"),
    )
    parameters = {
        classic.Parameters.FORMAT: 'svg',
        classic.Parameters.ANNOTATION: "frequency",
        classic.Parameters.ACT_METRIC: filters.get("annotation_type", "unique_objects"),
        classic.Parameters.EDGE_METRIC: "event_couples" if filters.get("annotation_type") == 'events'
        else filters.get("annotation_type"),
        classic.Parameters.ACT_THRESHOLD: activity_threshold,
        classic.Parameters.EDGE_THRESHOLD: path_threshold,
        classic.Parameters.PERFORMANCE_AGGREGATION_MEASURE: 'mean',
        classic.Parameters.BGCOLOR: 'white',
        classic.Parameters.RANKDIR: filters.get("orientation", "LR")
    }

    return parameters, ocdfg


def filter_ocel_ocpn(ocel, ocpn=None, filters=None):
    if filters is None:
        filters = {
            "selected_objects": None,
            "orientation": "LR"
        }

    if filters.get("selected_objects"):
        ocel = pm4py.filter_ocel_object_types(ocel, filters["selected_objects"])
        ocpn = discover(ocel, False)

    parameters = {
        wo_decoration.Parameters.FORMAT: 'svg',
        wo_decoration.Parameters.BGCOLOR: 'white',
        wo_decoration.Parameters.RANKDIR: filters.get("orientation", "LR")
    }

    return parameters, ocpn


def serialize_in_file(discovered):
    serialized_graph_path = f"{uuid.uuid4()}.pkl"
    with open(serialized_graph_path, 'wb') as f:
        pickle.dump(discovered, f)
    return serialized_graph_path


def deserialize_file(serialized_graph_path):
    with open(serialized_graph_path, 'rb') as f:
        discovered = pickle.load(f)
    return discovered


def compute_percentage_thresholds(ocdfg, activity_percent, path_percent, act_metric="events", edge_metric="event_couples"):
    if act_metric == "events":
        act_count = ocdfg["activities_indep"]["events"]
    elif act_metric == "unique_objects":
        act_count = ocdfg["activities_indep"]["unique_objects"]
    elif act_metric == "total_objects":
        act_count = ocdfg["activities_indep"]["total_objects"]
    else:
        raise ValueError("Invalid activity metric")

    if edge_metric == "event_couples":
        edges_count = ocdfg["edges"]["event_couples"]
    elif edge_metric == "unique_objects":
        edges_count = ocdfg["edges"]["unique_objects"]
    elif edge_metric == "total_objects":
        edges_count = ocdfg["edges"]["total_objects"]
    else:
        raise ValueError("Invalid edge metric")

    # Calculate activity threshold
    act_frequencies = [len(v) for v in act_count.values()]
    sorted_act = sorted(act_frequencies, reverse=True)
    act_cutoff_idx = int((activity_percent / 100) * len(sorted_act))
    act_cutoff_idx = max(0, min(act_cutoff_idx, len(sorted_act)-1))
    activity_threshold = sorted_act[act_cutoff_idx] if sorted_act else 0

    # Calculate edge threshold
    edge_frequencies = []
    for ot in edges_count:
        for edge in edges_count[ot]:
            edge_frequencies.append(len(edges_count[ot][edge]))
    sorted_edge = sorted(edge_frequencies, reverse=True)
    edge_cutoff_idx = int((path_percent / 100) * len(sorted_edge))
    edge_cutoff_idx = max(0, min(edge_cutoff_idx, len(sorted_edge)-1))
    edge_threshold = sorted_edge[edge_cutoff_idx] if sorted_edge else 0

    return activity_threshold, edge_threshold
