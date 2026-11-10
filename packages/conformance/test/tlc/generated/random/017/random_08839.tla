(*---
description: Evaluates a random seq expression, seed 262, number 8839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([[Append(<<3, 1, 2>>, 3) EXCEPT ![1] = (1 \div 3)] EXCEPT ![1] = (Cardinality(SUBSET {1}) - (\A b13685 \in {x \in 1..3 : x > 1} : FALSE))], ([a |-> (--1), b |-> (2147483647 < 1..3)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 174 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 171.
    | Expression starting at line 14, column 171.
    | Field Value starting at line 14, column 165.
    | Some [] Form starting at line 14, column 164.
    | ExtendableExpr starting at line 14, column 164.
    | Fatal errors while parsing TLA+ spec in file random_08839
    | In module random_08839
    | Could not parse module random_08839 from file random_08839.tla
    | *** Errors: 1
    | In module random_08839
    | Could not parse module random_08839 from file random_08839.tla
    3002:1 Parsing or semantic analysis failed.
---*)
