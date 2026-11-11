(*---
description: Evaluates a random int expression, seed 262, number 7545.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07545 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2147483647 + 3) * (FALSE \div 2147483647)) \in DOMAIN ([x \in Nat |-> x + 1] @@ <<1, 2>>)) -> (CASE ({1, 2} = 2..1) -> Head(<<>>) [] OTHER -> (2147483647 % 7) * LET b11628 == (--1) IN (1 \div -1)) [] OTHER -> <<(-(-1 \div 2147483647)), (((1 :> 2))[1] \div (1 \div 3))>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 202 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 199.
    | Expression starting at line 14, column 199.
    | Definition starting at line 14, column 189.
    | Let Definitions starting at line 14, column 189.
    | Case Other Arm starting at line 14, column 185.
    | Fatal errors while parsing TLA+ spec in file random_07545
    | In module random_07545
    | Could not parse module random_07545 from file random_07545.tla
    | *** Errors: 1
    | In module random_07545
    | Could not parse module random_07545 from file random_07545.tla
    3002:1 Parsing or semantic analysis failed.
---*)
