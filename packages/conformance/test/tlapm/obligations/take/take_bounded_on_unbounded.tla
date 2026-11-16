(*---
description: TAKE x \in S on an unbounded universal gives an error obligation saying the argument does not match the pattern, and the later steps see the old goal with de Bruijn indices off by one, so P prints as S. The error branch puts a TRUE fact in the SUFFICES context without shifting the goal (src/proof/p_simplify.ml#simplify_step).
ref: src/proof/p_simplify.ml#simplify_step
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE take_bounded_on_unbounded ----
CONSTANT P(_), S
THEOREM \A x : P(x)
<1> TAKE y \in S
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
    PROVE  \A x : S(x)

    @type: obligation
    @id: 2
    @loc: 11:1:11:17
    @status: to be proved
    @obl: 
    Error: the TAKE argument (y \in S) does not match the pattern (x)

    @type: obligationsnumber
    @count: 2
---*)
