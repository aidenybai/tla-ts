(*---
description: Evaluates a random bool expression, seed 262, number 7973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b12309 == CASE (\E b12310 \in 2..1 : TRUE) -> CASE FALSE -> 0 [] OTHER -> {2, 1, 3} [] OTHER -> (2 * -1) IN (-LET b12311 == 2 IN 1) \in ({(CHOOSE b12312 \in Nat : FALSE), (1 - 0)} \ ([<<3, 1, 2>> EXCEPT ![1] = 7] \cap ({1} \cup Nat)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 120 to line 14, col 120 of module random_07973 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 118.
    | Expression starting at line 14, column 118.
    | ExtendableExpr starting at line 14, column 117.
    | Expression starting at line 14, column 117.
    | Case Other Arm starting at line 14, column 108.
    | Fatal errors while parsing TLA+ spec in file random_07973
    | In module random_07973
    | Could not parse module random_07973 from file random_07973.tla
    | *** Errors: 1
    | In module random_07973
    | Could not parse module random_07973 from file random_07973.tla
    3002:1 Parsing or semantic analysis failed.
---*)
