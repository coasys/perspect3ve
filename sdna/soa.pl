subject_class("SoA", sokjdpau).

constructor(sokjdpau, '[{action: "addLink", source: "this", predicate: "SoA://has_title", target: "literal://string:This%20State%20o%20Affair%20has%20a%20meaningful%20title"},{action: "addLink", source: "this", predicate: "SoA://is_implemented", target: "ad4m://false"}]').
instance(sokjdpau, Base) :- triple(Base, "SoA://has_title", _), triple(Base, "SoA://is_implemented", _).

property(sokjdpau, "title").
property_resolve(sokjdpau, "title").
property_resolve_language(sokjdpau, "title", "literal").
property_getter(sokjdpau, Base, "title", Value) :- triple(Base, "SoA://has_title", Value).
property_setter(sokjdpau, "title", '[{action: "setSingleTarget", source: "this", predicate: "SoA://has_title", target: "value"}]').

property(sokjdpau, "is_implemented").
property_getter(sokjdpau, Base, "is_implemented", Value) :- triple(Base, "SoA://is_implemented", Value).
property_setter(sokjdpau, "is_implemented", '[{action: "setSingleTarget", source: "this", predicate: "SoA://is_implemented", target: "value"}]').
property_named_option(sokjdpau, "is_implemented", "ad4m://true", "true").
property_named_option(sokjdpau, "is_implemented", "ad4m://false", "false").

collection(sokjdpau, "children").
collection_getter(sokjdpau, Base, "children", List) :-
    findall(C, (triple(Base, _, C), instance(sokjdpau, C)), Children).
collection_adder(sokjdpau, "children", '[{action: "addLink", source: "this", predicate: "SoA://child", target: "value"}]').

property(sokjdpau, "is_leaf").
property_getter(sokjdpau, Base, "is_leaf", Value) :- triple(Base, "SoA://is_leaf", Value).
property_setter(sokjdpau, "is_leaf", '[{action: "setSingleTarget", source: "this", predicate: "SoA://is_leaf", target: "value"}]').
property_named_option(sokjdpau, "is_leaf", "ad4m://true", "true").
property_named_option(sokjdpau, "is_leaf", "ad4m://false", "false").

property(sokjdpau, "size").
property_getter(sokjdpau, Base, "size", "SoA://small") :- 
    collection_getter(sokjdpau, Base, "children", []), 
    property_getter(sokjdpau, Base, "is_leaf", "ad4m://true"),
    !.

property_getter(sokjdpau, Base, "size", "SoA://big") :-
    not(property_getter(sokjdpau, Base, "is_leaf", "ad4m://true")),
    collection_getter(sokjdpau, Base, "children", Children),
    Children \= [],
    all_have_known_complexity(Children).

property_getter(sokjdpau, Base, "size", "SoA://unknown") :-
    not(property_getter(sokjdpau, Base, "is_leaf", "ad4m://true")),
    not(property_getter(sokjdpau, Base, "size", "SoA://big")).

property_getter(sokjdpau, Base, "size", "SoA://unknown") :- 
    (property_getter(sokjdpau, Base, "is_leaf", "ad4m://true") -> fail; true).
    (property_getter(sokjdpau, Base, "size", "SoA://big") -> fail; true).

has_known_complexity(Base) :- 
    property_getter(sokjdpau, Base, "is_implemented", "ad4m://true");
    property_getter(sokjdpau, Base, "size", "SoA://small");
    property_getter(sokjdpau, Base, "size", "SoA://big").

all_have_known_complexity([]).
all_have_known_complexity([Head|Tail]) :- 
    has_known_complexity(Head),
    all_have_known_complexity(Tail).

p3_class_icon(sokjdpau, "diagram-3").
p3_class_color(sokjdpau, "#00FA00").
p3_instance_color(sokjdpau, Instance, "#FF0000") :- property_getter(sokjdpau, Instance, "size", "SoA://unknown"), not(property_getter(c, Instance, "is_implemented", "ad4m://true")).
p3_instance_color(sokjdpau, Instance, "#00FF00") :- property_getter(sokjdpau, Instance, "is_implemented", "ad4m://true").
p3_instance_color(sokjdpau, Instance, "#FFFF00") :- property_getter(sokjdpau, Instance, "size", "SoA://big"), not(property_getter(c, Instance, "is_implemented", "ad4m://true")).
p3_instance_color(sokjdpau, Instance, "#BBFF77") :- property_getter(c, Instance, "is_implemented", "ad4m://true") -> fail ; property_getter(sokjdpau, Instance, "size", "SoA://small").







