const REALS = `---- MODULE Reals ----
EXTENDS Integers

Real == "Reals"

a / b == CHOOSE quotient \\in Real : quotient * b = a

Infinity == CHOOSE value : (value \\notin Real) /\\ (\\A real \\in Real : value > real)
====`;

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
