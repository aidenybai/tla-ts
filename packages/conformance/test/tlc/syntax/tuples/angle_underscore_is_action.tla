(*---
description: ">>_ takes a subscript, so <<x>>_y is an action form and fails the constant level of an assumption."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE angle_underscore_is_action ----
VARIABLE y
ASSUME <<TRUE>>_y
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 17 of module angle_underscore_is_action
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 2.
    3002:1 Parsing or semantic analysis failed.
---*)
