(*---
description: Evaluates a random int expression, seed 262, number 2690.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02690 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (7 * 3)] :> ((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE))[(-1 % -1)]))[IF ((-1 \div -1) \in UNION {Nat, SUBSET {1}}) THEN LET b4258 == IF TRUE THEN 2147483647 ELSE 2 IN (<<3, 1, 2>> - b4258) ELSE ((1 - 0) + (<<1, 2>> = <<5, 6>>))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 154 to line 14, col 157 of module random_02690 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 151.
    | ExtendableExpr starting at line 14, column 150.
    | Expression starting at line 14, column 150.
    | ExtendableExpr starting at line 14, column 149.
    | Fatal errors while parsing TLA+ spec in file random_02690
    | In module random_02690
    | Could not parse module random_02690 from file random_02690.tla
    | *** Errors: 1
    | In module random_02690
    | Could not parse module random_02690 from file random_02690.tla
    3002:1 Parsing or semantic analysis failed.
---*)
