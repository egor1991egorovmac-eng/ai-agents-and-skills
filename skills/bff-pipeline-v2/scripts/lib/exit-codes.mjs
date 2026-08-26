export const EXIT = {
  PASS: 0,
  FAIL: 1,
  BLOCKED: 2,
  INVALID_INPUT: 3,
};

export const STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  BLOCKED: 'BLOCKED',
};

export function exitCodeForStatus(status) {
  if (status === STATUS.PASS) {
    return EXIT.PASS;
  }

  if (status === STATUS.FAIL) {
    return EXIT.FAIL;
  }

  if (status === STATUS.BLOCKED) {
    return EXIT.BLOCKED;
  }

  return EXIT.INVALID_INPUT;
}
