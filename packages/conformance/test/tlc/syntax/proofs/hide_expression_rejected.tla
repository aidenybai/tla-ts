(*---
description: "HIDE allows only names of facts, so an expression there is rejected."
ref: "tla2sany/semantic/UseOrHideNode.java#factCheck"
features: [proofs]
outcome: parse-error
---*)
---- MODULE hide_expression_rejected ----
HIDE 1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 6 to line 8, col 10 of module hide_expression_rejected
    | The only expression allowed as a fact in a HIDE is 
    | the name of a theorem, assumption, or step.
    3002:1 Parsing or semantic analysis failed.
---*)
