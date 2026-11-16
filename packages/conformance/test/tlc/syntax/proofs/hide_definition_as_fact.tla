(*---
description: HIDE of a non-theorem operator as a fact is rejected.
ref: "tla2sany/semantic/UseOrHideNode.java#factCheck"
features: [proofs]
outcome: parse-error
---*)
---- MODULE hide_definition_as_fact ----
A == TRUE
HIDE A
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 6 of module hide_definition_as_fact
    | The only expression allowed as a fact in a HIDE is 
    | the name of a theorem, assumption, or step.
    3002:1 Parsing or semantic analysis failed.
---*)
