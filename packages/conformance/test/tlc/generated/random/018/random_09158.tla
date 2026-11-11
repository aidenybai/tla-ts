(*---
description: Evaluates a random function expression, seed 262, number 9158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b14220 \in {b14221 \in UNION {1..3, {}} : (TRUE \/ FALSE)} |-> CASE (b14220 = -1) -> (-b14220) [] OTHER -> (b14220 * -1)] @@ [b14222 \in UNION {(Nat \cap {1}), ({1} \ 2..1)} |-> (CHOOSE b14223 \in (Nat \ SUBSET {1}) : (b14223 \in {1, 2}))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 133 to line 14, col 133 of module random_09158 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | Case Other Arm starting at line 14, column 116.
    | Fatal errors while parsing TLA+ spec in file random_09158
    | In module random_09158
    | Could not parse module random_09158 from file random_09158.tla
    | *** Errors: 1
    | In module random_09158
    | Could not parse module random_09158 from file random_09158.tla
    3002:1 Parsing or semantic analysis failed.
---*)
