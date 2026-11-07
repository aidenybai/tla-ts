(*---
description: Evaluates a random seq expression, seed 262, number 9585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append([Tail(<<3, 1, 2>>) EXCEPT ![1] = (--1)], CASE (3 \in 1..3) -> Head(<<1, 2>>) [] OTHER -> (CHOOSE b14886 \in {1, 2} : TRUE)) \o Append(([<<5, 6>> EXCEPT ![0] = 1] \/ (7 = 2)), (IF TRUE THEN 0 ELSE -1 % IF TRUE THEN 2 ELSE FALSE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 60 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 57.
    | Expression starting at line 14, column 57.
    | Except Spec starting at line 14, column 50.
    | Some [] Form starting at line 14, column 24.
    | ExtendableExpr starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_09585
    | In module random_09585
    | Could not parse module random_09585 from file random_09585.tla
    | *** Errors: 1
    | In module random_09585
    | Could not parse module random_09585 from file random_09585.tla
    3002:1 Parsing or semantic analysis failed.
---*)
