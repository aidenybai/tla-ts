(*---
description: Evaluates a random int expression, seed 262, number 5171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] = [a |-> <<1, 2>>, b |-> TRUE]) /\ (CASE TRUE -> 0 [] OTHER -> 7 \in UNION {{1}, Nat})) THEN (((--1) + (CHOOSE b8022 \in {} : FALSE)) % CASE (\A b8023 \in SUBSET {1} : FALSE) -> (<<5, 6>> - 7) [] OTHER -> (7 * 3)) ELSE Cardinality({IF TRUE THEN {} ELSE [x \in Nat |-> x + 1], (CHOOSE b8024 \in {x \in 1..3 : x > 1} : FALSE)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 162 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 159.
    | Expression starting at line 14, column 159.
    | ExtendableExpr starting at line 14, column 158.
    | Expression starting at line 14, column 158.
    | ExtendableExpr starting at line 14, column 157.
    | Fatal errors while parsing TLA+ spec in file random_05171
    | In module random_05171
    | Could not parse module random_05171 from file random_05171.tla
    | *** Errors: 1
    | In module random_05171
    | Could not parse module random_05171 from file random_05171.tla
    3002:1 Parsing or semantic analysis failed.
---*)
