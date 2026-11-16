(*---
description: 4291 fires for each undefined operator.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_defined_none_of_two ----
RECURSIVE F, G
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 11 to line 8, col 11 of module recursive_defined_none_of_two
    | Symbol F declared in RECURSIVE statement but not defined.
    | line 8, col 14 to line 8, col 14 of module recursive_defined_none_of_two
    | Symbol G declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
