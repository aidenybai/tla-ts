// TLC's Reals.tla, verbatim, so errors inside it point at the same lines as TLC's.
const REALS = String.raw`-------------------------------- MODULE Reals -------------------------------
(***************************************************************************)
(* This module provides dummy definitions of the operators that are        *)
(* defined by the real Reals module.  It is expected that any tool that    *)
(* handles specifications that use real numbers will provide its own       *)
(* implementations of these operators.  TLC currently does not handle real *)
(* numbers and produces an error if a specification requires TLC to        *)
(* evaluate the operators defined here or to evaluate any operator defined *)
(* in the Integers module that is applied to non-integer real numbers.     *)
(*                                                                         *)
(* See the book "Specifying Systems" for the real Reals module.            *)
(***************************************************************************)
EXTENDS Integers

Real  == "Reals"
a / b == CHOOSE m \in Real : m * b = a
Infinity == CHOOSE i : (i \notin Real) /\ (\A r \in Real : i > r)
=============================================================================`;

const REAL_TIME = `---- MODULE RealTime ----
EXTENDS Reals

VARIABLE now

RTBound(A, v, D, E) ==
  LET TNext(timer) == timer' = IF <<A>>_v \\/ ~(ENABLED <<A>>_v)'
                               THEN 0
                               ELSE timer + (now' - now)
      Timer(timer) == (timer = 0) /\\ [][TNext(timer)]_<<timer, v, now>>
      MaxTime(timer) == [](timer \\leq E)
      MinTime(timer) == [][A => timer \\geq D]_v
  IN \\EE timer : Timer(timer) /\\ MaxTime(timer) /\\ MinTime(timer)

RTnow(v) == LET NowNext == /\\ now' \\in {real \\in Real : real > now}
                           /\\ UNCHANGED v
            IN /\\ now \\in Real
               /\\ [][NowNext]_now
               /\\ \\A real \\in Real : WF_now(NowNext /\\ (now' > real))
====`;

const TOOLBOX = `---- MODULE Toolbox ----
LOCAL INSTANCE Naturals
LOCAL INSTANCE FiniteSets
LOCAL INSTANCE TLC

_TETrace == CHOOSE trace \\in [(Nat \\ {0}) -> STRING] : TRUE

LOCAL _TETraceLength == Cardinality(DOMAIN _TETrace)

_TEPosition ==
  IF TLCGet("level") >= _TETraceLength
  THEN _TETraceLength
  ELSE IF TLCGet("level") = 0 THEN 1 ELSE TLCGet("level")
====`;

export const BUNDLED_MODULES = new Map([
  ["Reals", REALS],
  ["RealTime", REAL_TIME],
  ["Toolbox", TOOLBOX],
]);
