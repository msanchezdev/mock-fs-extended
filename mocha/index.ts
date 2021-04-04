import EventEmitter from 'events';
import mockfs from '..';

type MockedFSMock = Parameters<typeof mockfs>[0] & {
  $cwd?: string;
};
export function sandboxedTest(
  test: Mocha.Func | Mocha.AsyncFunc,
): Mocha.Func | Mocha.AsyncFunc;
export function sandboxedTest(
  mock: MockedFSMock,
  test: Mocha.Func | Mocha.AsyncFunc,
): Mocha.Func | Mocha.AsyncFunc;
export function sandboxedTest(
  mock: MockedFSMock | Mocha.Func | Mocha.AsyncFunc,
  test?: Mocha.Func | Mocha.AsyncFunc,
) {
  if (typeof mock === 'function') {
    test = mock;
    mock = sandboxedTest.default;
  }

  const mockedTest: Mocha.Func | Mocha.AsyncFunc = function (done: Mocha.Done) {
    const originalProcess = process;

    let path = originalProcess.cwd();
    const p = Object.assign(new EventEmitter(), originalProcess, {
      cwd() {
        return path;
      },
      chdir(p: string) {
        path = p;
      },
    });
    global.process = p;

    // mock fs
    const { $cwd, ...mockContent } = mock as any;
    mockfs(mockContent)
      .then((cleanup) => {
        process.chdir($cwd || path);

        let finished = false;
        const finish = (err?: any) => {
          finished = true;
          global.process = originalProcess;
          cleanup();
          done(err);
        };

        // exec test
        try {
          const result = test!.bind(this)(finish);
          if (result) {
            (<Promise<any>>result).then(finish).catch(finish);
          } else if (!finished) {
            finish();
          }
        } catch (err) {
          finish(err);
        }
      })
      .catch(done);
  };

  return mockedTest;
}
sandboxedTest.default = {} as MockedFSMock;
