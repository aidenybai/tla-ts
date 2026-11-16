(*---
description: "@ of the outer EXCEPT is in scope in an inner EXCEPT's selector."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE at_in_outer_selector_of_inner ----
Test == [<<1>> EXCEPT ![1] = [<<7>> EXCEPT ![@] = 8]] = <<<<8>>>>
====

(*--- recorded
all:
  exit: 0
---*)
