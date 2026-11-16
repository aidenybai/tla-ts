(*---
description: "An unnamed instance's definition does not satisfy a RECURSIVE declaration."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_defined_by_instance ----
---- MODULE I ----
F == 1
====
RECURSIVE F
INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 1 to line 9, col 6 of module recursive_defined_by_instance
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 11, col 11 to line 11, col 11 of module recursive_defined_by_instance.
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 11 to line 11, col 11 of module recursive_defined_by_instance
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
