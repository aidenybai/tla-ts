(*---
description: Prefix Operator References. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/prefix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE prefix_op_prefix_operator_references ----
op == f(
  ~,
  \lnot,
  \neg,
  UNION,
  SUBSET,
  DOMAIN,
  -.,
  ENABLED,
  UNCHANGED,
  [],
  <>
)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 7 to line 9, col 7 of module prefix_op_prefix_operator_references
    | Unknown operator: `f'.
    3002:1 Parsing or semantic analysis failed.
---*)
