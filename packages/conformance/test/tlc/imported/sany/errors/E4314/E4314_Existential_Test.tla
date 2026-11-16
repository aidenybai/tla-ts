(*---
description: SANY reports E4314. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4314_Existential_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If an existential quantifier has a temporal-level body, it cannot have an
action-level set bound.
---- MODULE E4314_Existential_Test ----
VARIABLE v
op == \E x \in v' : []v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 16 to line 12, col 17 of module E4314_Existential_Test
    | Action-level bound of quantified temporal formula.
    3002:1 Parsing or semantic analysis failed.
---*)
