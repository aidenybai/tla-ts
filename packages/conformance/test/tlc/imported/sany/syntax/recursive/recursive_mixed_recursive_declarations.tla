(*---
description: Mixed Recursive Declarations. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/recursive.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE recursive_mixed_recursive_declarations ----
RECURSIVE f(_), g, h(_, _, _), _+_, -. _, _ ^+
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 6
    | line 9, col 11 to line 9, col 14 of module recursive_mixed_recursive_declarations
    | Symbol f declared in RECURSIVE statement but not defined.
    | line 9, col 17 to line 9, col 17 of module recursive_mixed_recursive_declarations
    | Symbol g declared in RECURSIVE statement but not defined.
    | line 9, col 20 to line 9, col 29 of module recursive_mixed_recursive_declarations
    | Symbol h declared in RECURSIVE statement but not defined.
    | line 9, col 32 to line 9, col 34 of module recursive_mixed_recursive_declarations
    | Symbol + declared in RECURSIVE statement but not defined.
    | line 9, col 37 to line 9, col 40 of module recursive_mixed_recursive_declarations
    | Symbol -. declared in RECURSIVE statement but not defined.
    | line 9, col 43 to line 9, col 46 of module recursive_mixed_recursive_declarations
    | Symbol ^+ declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
