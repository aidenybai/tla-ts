(*---
description: Evaluates a random function expression, seed 262, number 5983.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05983 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b9217 \in ((Nat \cup {x \in 1..3 : x > 1}) \ UNION {{x \in 1..3 : x > 1}, {}}) |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] - (0 % 0))] EXCEPT ![(CHOOSE b9218 \in DOMAIN ((1 :> 2) @@ (1 :> 2)) : (~(<<3, 1, 2>> = (1 :> 2))))] = CASE ((2147483647 - 7) = (3 * 2147483647)) -> (CHOOSE b9219 \in (2..1 \cup 2..1) : (Nat \subseteq {})) [] OTHER -> (CASE TRUE -> 7 [] OTHER -> SUBSET {1} - CASE FALSE -> 0 [] OTHER -> 0)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 391 to line 14, col 396 of module random_05983 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 398.
    | Expression starting at line 14, column 391.
    | Case Other Arm starting at line 14, column 382.
    | CASE Expression starting at line 14, column 364.
    | Expression starting at line 14, column 364.
    | Fatal errors while parsing TLA+ spec in file random_05983
    | In module random_05983
    | Could not parse module random_05983 from file random_05983.tla
    | *** Errors: 1
    | In module random_05983
    | Could not parse module random_05983 from file random_05983.tla
    3002:1 Parsing or semantic analysis failed.
---*)
