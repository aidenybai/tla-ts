(*---
description: "A recursive function selected whole calls itself, and its body selected where it makes no recursive call needs no binding of its name."
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE recursive_function_selected_whole ----
EXTENDS Naturals
r[n \in {0, 1}] == IF n = 0 THEN 0 ELSE r[n - 1] + 1
Test == r!:[1] = 1 /\ r!(0) = 0 /\ (LET s[n \in {0, 1}] == IF n = 0 THEN 0 ELSE s[n - 1] + 1 IN s!:[1]) = 1
====

(*--- recorded
all:
  exit: 0
---*)
