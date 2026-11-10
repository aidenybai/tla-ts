(*---
description: Evaluates a random function expression, seed 262, number 775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((\E b1269 \in {2, 1, 3} : TRUE) :> (-1 + 7)) EXCEPT ![CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Head(<<1, 2>>) [] OTHER -> Len(<<1, 2>>)] = (CHOOSE b1270 \in ({2, 1, 3} \ 2..1) : (\E b1271 \in {1, 2} : FALSE))] EXCEPT ![IF ([[a |-> 1] EXCEPT !.a = 3] = [[a |-> 1] EXCEPT !.a = FALSE]) THEN Cardinality({b1272 \in SUBSET {1} : TRUE}) ELSE (-Cardinality(SUBSET {1}))] = (Len(SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0)) * ((-1 :> -1))[(--1)])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 464 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 461.
    | Expression starting at line 14, column 461.
    | Some [] Form starting at line 14, column 460.
    | ExtendableExpr starting at line 14, column 448.
    | ExtendableExpr starting at line 14, column 390.
    | Fatal errors while parsing TLA+ spec in file random_00775
    | In module random_00775
    | Could not parse module random_00775 from file random_00775.tla
    | *** Errors: 1
    | In module random_00775
    | Could not parse module random_00775 from file random_00775.tla
    3002:1 Parsing or semantic analysis failed.
---*)
