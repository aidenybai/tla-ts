(*---
description: "For multiple bounds the first variable varies fastest, so \\A visits <<2, 1>> before <<1, 2>>."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_first_variable_varies_fastest ----
EXTENDS Integers, TLC
Test == \A x \in {1, 2}, y \in {1, 2} : PrintT(<<x, y>>)
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
