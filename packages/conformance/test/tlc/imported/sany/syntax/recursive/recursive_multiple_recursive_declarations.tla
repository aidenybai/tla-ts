(*---
description: Multiple Recursive Declarations. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/recursive.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE recursive_multiple_recursive_declarations ----
RECURSIVE f(_), g(_)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 11 to line 9, col 14 of module recursive_multiple_recursive_declarations
    | Symbol f declared in RECURSIVE statement but not defined.
    | line 9, col 17 to line 9, col 20 of module recursive_multiple_recursive_declarations
    | Symbol g declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
