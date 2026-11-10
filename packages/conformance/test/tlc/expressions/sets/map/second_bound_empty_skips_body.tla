(*---
description: "An empty later bound makes {e : x \\in S, y \\in {}} empty without evaluating e."
ref: "tlc2/tool/ContextEnumerator.java#ContextEnumerator"
flags: [expression]
outcome: success
---*)
---- MODULE second_bound_empty_skips_body ----
EXTENDS Integers
Test == {1 \div 0 : x \in 1..2, y \in {}} = {}
====

(*--- recorded
all:
  exit: 0
---*)
