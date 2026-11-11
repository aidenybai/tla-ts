(*---
description: "A RECURSIVE declaration after the definition only warns, and is then rejected as undefined."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE declared_after_definition ----
F == 1
RECURSIVE F
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 11 to line 9, col 11 of module declared_after_definition
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 8, col 1 to line 8, col 6 of module declared_after_definition.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module declared_after_definition
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
