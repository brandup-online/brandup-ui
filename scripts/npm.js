const childProcess = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

const getArgsList = (startIndex = 3) => process.argv.reduce((acc, current, index) => index >= startIndex? acc += current + " " : '', '');

const commands = {
    install: (args) => `npm install ${args}`,
    build: (args) => `npm run build ${args}`,
    pack: (args) => `npm pack ${args}`
}

if (!process.argv[2])
    throw new Error(`Not set command name. Available commands: ${Object.keys(commands)}`);

const commandName = process.argv[2].toLowerCase();
const command = commands[commandName];
if (!command)
    throw new Error(`Command ${commandName} is not found. Available commands: ${Object.keys(commands)}`);

const commandArgs = getArgsList();
const commandStr = command(commandArgs);

console.info(`-------begin ${commandName}-------`);
console.info('');

console.info(`command name: ${commandName}`);
console.info(`command argumments: ${commandArgs}`);

const packagesPath = path.join(__dirname, "..", 'npm');
console.info(`packages path: ${packagesPath}`);

fs.readdirSync(packagesPath, { recursive: false }).forEach(dir => {
    const dirPath = path.join(packagesPath, dir);
	if (!fs.lstatSync(dirPath).isDirectory())
		return;

    execute(dirPath, dir, commandStr);
});

console.info('');
console.info(`-------end ${commandName}-------`);

function execute(dirPath, dirName, command) {
	console.info('');
	console.info(`-------${dirName}-------`);
	console.info('');

	console.info(`${dirPath} ${command}`);
	console.info('');

	const subprocess = childProcess.execSync(`cd ${dirPath} && ${command}`, {
		encoding: 'utf8',
		shell: true,
		stdio:'inherit'
	});

	return subprocess;
}