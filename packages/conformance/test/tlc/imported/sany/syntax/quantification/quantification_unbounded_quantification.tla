(*---
description: Unbounded Quantification. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/quantification.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE quantification_unbounded_quantification ----
op == \A x : TRUE
op == \E x, y : FALSE
op == \AA x, y, z : TRUE
op == \EE x, y, z, w : FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 3
    | line 10, col 1 to line 10, col 21 of module quantification_unbounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 17 of module quantification_unbounded_quantification.
    | line 11, col 1 to line 11, col 24 of module quantification_unbounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 17 of module quantification_unbounded_quantification.
    | line 12, col 1 to line 12, col 28 of module quantification_unbounded_quantification
    | Multiple declarations or definitions for symbol op.  
    | This duplicates the one at line 9, col 1 to line 9, col 17 of module quantification_unbounded_quantification.
    | Semantic errors:
    | *** Errors: 3
    | line 10, col 1 to line 10, col 21 of module quantification_unbounded_quantification
    | Operator op already defined or declared.
    | line 11, col 1 to line 11, col 24 of module quantification_unbounded_quantification
    | Operator op already defined or declared.
    | line 12, col 1 to line 12, col 28 of module quantification_unbounded_quantification
    | Operator op already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
