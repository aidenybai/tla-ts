(*---
description: 4291 fires for the operator left undefined.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_defined_one_of_two ----
RECURSIVE F, G
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 14 to line 8, col 14 of module recursive_defined_one_of_two
    | Symbol G declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
