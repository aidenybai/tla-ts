(*---
description: Evaluates a random function expression, seed 262, number 446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE) EXCEPT ![(Cardinality({}) \div (3 * 2147483647))] = LET b728 == CASE FALSE -> [a |-> 1] [] OTHER -> 2147483647 IN (<<5, 6>> \div <<1>>)] EXCEPT ![[[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (-7)] EXCEPT !.a = @ + Len(Tail({2, 1, 3}))]] = (Head((<<1>> \o -1)) \div ((CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE))[Len(<<1, 2>>)])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \o in block line 14, col 325 to line 14, col 326 of module random_00446 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 319.
    | Expression starting at line 14, column 319.
    | ExtendableExpr starting at line 14, column 318.
    | Expression starting at line 14, column 318.
    | Optional Arguments starting at line 14, column 317.
    | Fatal errors while parsing TLA+ spec in file random_00446
    | In module random_00446
    | Could not parse module random_00446 from file random_00446.tla
    | *** Errors: 1
    | In module random_00446
    | Could not parse module random_00446 from file random_00446.tla
    3002:1 Parsing or semantic analysis failed.
---*)
