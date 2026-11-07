(*---
description: Evaluates a random int expression, seed 262, number 5426.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05426 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([[b8402 \in {} |-> b8402] EXCEPT !.a = CASE FALSE -> 0 [] OTHER -> 7] = ((--1) % (2 - 1))) -> CASE (\A b8403 \in {b8404 \in Nat : FALSE} : (\E b8405 \in SUBSET {1} : FALSE)) -> (Cardinality({x \in 1..3 : x > 1}) + (CHOOSE b8406 \in 2..1 : FALSE)) [] OTHER -> IF (FALSE \/ TRUE) THEN CASE FALSE -> 0 [] OTHER -> 2 ELSE (3 % 1) [] OTHER -> Head(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 98 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 95.
    | Expression starting at line 14, column 95.
    | ExtendableExpr starting at line 14, column 94.
    | ExtendableExpr starting at line 14, column 22.
    | Expression starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_05426
    | In module random_05426
    | Could not parse module random_05426 from file random_05426.tla
    | *** Errors: 1
    | In module random_05426
    | Could not parse module random_05426 from file random_05426.tla
    3002:1 Parsing or semantic analysis failed.
---*)
