(*---
description: Basic Recursive Declaration. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/recursive.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE recursive_basic_recursive_declaration ----
RECURSIVE f(_)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 14 of module recursive_basic_recursive_declaration
    | Symbol f declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
