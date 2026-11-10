(*---
description: Evaluates a random record expression, seed 262, number 6943.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06943 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> ((1 :> 2))[-1], b |-> (7 = [x \in Nat |-> x + 1])] EXCEPT !.a = @ + Head((1..3 \ 1..3))] EXCEPT !.a = (((-1 * 3) \div (1 \div -1)) - ((\A b10628 \in {} : TRUE) - (0 * 1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 146 to line 14, col 149 of module random_06943 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 144.
    | Expression starting at line 14, column 144.
    | ExtendableExpr starting at line 14, column 143.
    | ExtendableExpr starting at line 14, column 129.
    | Expression starting at line 14, column 129.
    | Fatal errors while parsing TLA+ spec in file random_06943
    | In module random_06943
    | Could not parse module random_06943 from file random_06943.tla
    | *** Errors: 1
    | In module random_06943
    | Could not parse module random_06943 from file random_06943.tla
    3002:1 Parsing or semantic analysis failed.
---*)
