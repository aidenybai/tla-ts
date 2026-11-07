(*---
description: SANY reports E4354. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4354_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a PICK step is a quantified temporal formula, the bound must be constant.
---- MODULE E4354_Test ----
VARIABLE v
THEOREM TRUE
PROOF
<1> PICK x \in v : []v
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 16 to line 13, col 16 of module E4354_Test
    | Non-constant bound of temporal PICK.
    3002:1 Parsing or semantic analysis failed.
---*)
