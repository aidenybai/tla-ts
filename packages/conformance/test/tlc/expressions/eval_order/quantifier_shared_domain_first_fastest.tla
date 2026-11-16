(*---
description: "\\A x, y \\in S enumerates like two separate bounds, with x varying fastest."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_shared_domain_first_fastest ----
EXTENDS Integers, TLC
Test == \A x, y \in {1, 2} : PrintT(<<x, y>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 1>>
    | <<2, 1>>
    | <<1, 2>>
    | <<2, 2>>
---*)
