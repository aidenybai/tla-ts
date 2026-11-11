(*---
description: Evaluates a random int expression, seed 262, number 999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1600 \in ({b1601 : b1601 \in Nat} \cap ({1} \cup SUBSET {1})) : ((1..3 = 1..3) /\ (\E b1602 \in Nat : FALSE))) \div {(-(7 \div -1)), Head(LET b1603 == 1 IN b1603)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 148 to line 14, col 151 of module random_00999 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 146.
    | Expression starting at line 14, column 146.
    | ExtendableExpr starting at line 14, column 145.
    | Expression starting at line 14, column 144.
    | ExtendableExpr starting at line 14, column 143.
    | Fatal errors while parsing TLA+ spec in file random_00999
    | In module random_00999
    | Could not parse module random_00999 from file random_00999.tla
    | *** Errors: 1
    | In module random_00999
    | Could not parse module random_00999 from file random_00999.tla
    3002:1 Parsing or semantic analysis failed.
---*)
