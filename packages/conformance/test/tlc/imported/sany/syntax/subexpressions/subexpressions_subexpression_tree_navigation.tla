(*---
description: Subexpression Tree Navigation. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/subexpressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE subexpressions_subexpression_tree_navigation ----
tree_nav == op(a, b)!<<!>>!3!(x, y)!:!@
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 13 to line 9, col 14 of module subexpressions_subexpression_tree_navigation
    | Unknown operator: `op'.
    3002:1 Parsing or semantic analysis failed.
---*)
