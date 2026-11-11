(*---
description: Evaluates a random bool expression, seed 262, number 3667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b5793 \in ((IF TRUE THEN 1 ELSE 1 .. [<<>> EXCEPT ![1] = TRUE]) \cap ((2 * -1) .. (7 - 1))) : ({b5794 \in ({x \in 1..3 : x > 1} \cap {1}) : (<<>> = [x \in 1..2 |-> x])} = {CASE FALSE -> b5793 [] OTHER -> 2, (b5793 * 7)})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 93 to line 14, col 93 of module random_03667 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 91.
    | Expression starting at line 14, column 91.
    | ExtendableExpr starting at line 14, column 90.
    | Expression starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 89.
    | Fatal errors while parsing TLA+ spec in file random_03667
    | In module random_03667
    | Could not parse module random_03667 from file random_03667.tla
    | *** Errors: 1
    | In module random_03667
    | Could not parse module random_03667 from file random_03667.tla
    3002:1 Parsing or semantic analysis failed.
---*)
