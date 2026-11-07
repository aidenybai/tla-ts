(*---
description: TAKE x on a bounded universal gives an error obligation, and the later steps see a goal whose de Bruijn indices are off by one. The error branch of Proof.Simplify.simplify_step puts a TRUE fact in the SUFFICES context without shifting the old goal (src/proof/p_simplify.ml#simplify_step).
ref: src/proof/p_simplify.ml#simplify_step
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE take_unbounded_on_bounded ----
CONSTANT P(_), S
THEOREM \A x \in S : P(x)
<1> TAKE y
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           TRUE 
    PROVE  \A x \in  : S(x)

    @type: obligation
    @id: 2
    @loc: 11:1:11:11
    @status: to be proved
    @obl: 
    Error: the TAKE argument (y) does not match the pattern (x \in S)

    @type: obligationsnumber
    @count: 2
---*)
