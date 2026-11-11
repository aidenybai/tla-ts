(*---
description: Evaluates a random function expression, seed 262, number 1119.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01119 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (LET b1789 == 0 IN b1789 \in {b1790 \in SUBSET {1} : TRUE}) -> LET b1791 == [[a |-> 1] EXCEPT !.a = @ + 2] IN (--1) [] OTHER -> (-(2147483647 \div 0)) :> (({b1792 : b1792 \in {2, 1, 3}} \cup (2147483647 .. 7)) * LET b1793 == (-3) IN (b1793 % b1793))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 135 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 132.
    | Expression starting at line 14, column 132.
    | Case Other Arm starting at line 14, column 85.
    | Expression starting at line 14, column 85.
    | Case Arm starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_01119
    | In module random_01119
    | Could not parse module random_01119 from file random_01119.tla
    | *** Errors: 1
    | In module random_01119
    | Could not parse module random_01119 from file random_01119.tla
    3002:1 Parsing or semantic analysis failed.
---*)
