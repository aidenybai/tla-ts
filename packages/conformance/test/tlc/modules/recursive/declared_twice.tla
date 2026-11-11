(*---
description: "A second RECURSIVE declaration of one name only warns, but the definition satisfies only the first, so the second is rejected as undefined."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE declared_twice ----
RECURSIVE F
RECURSIVE F
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 9, col 11 to line 9, col 11 of module declared_twice
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 8, col 11 to line 8, col 11 of module declared_twice.
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module declared_twice
    | Symbol F declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
