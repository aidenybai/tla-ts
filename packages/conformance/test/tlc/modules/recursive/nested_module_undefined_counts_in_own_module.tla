(*---
description: "A nested module's RECURSIVE operator must be defined in that nested module."
ref: "tla2sany/semantic/Generator.java#checkForUndefinedRecursiveOps"
features: [recursive]
outcome: parse-error
---*)
---- MODULE nested_module_undefined_counts_in_own_module ----
---- MODULE I ----
RECURSIVE F
====
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module nested_module_undefined_counts_in_own_module
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
